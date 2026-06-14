/**
 * WebPEncoder — native iOS implementation of the JS binding in
 * src/native/WebPEncoder.ts.
 *
 *  - cropToFile:    crop a rect (source pixels) out of an image, write a PNG.
 *  - encodeSticker: composite a (transparent) cutout onto a square transparent
 *                   canvas using a "contain" fit, then encode to WebP while
 *                   auto-tuning quality to stay under maxBytes.
 *  - encodeTrayIcon: contain-fit an image onto a square canvas, write a PNG.
 *
 * WebP encode/decode is provided by SDWebImageWebPCoder (libwebp). The tray icon
 * input is the already-generated .webp sticker, so the coder is registered for
 * decoding too.
 */

#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import <SDWebImage/SDWebImage.h>
#import <SDWebImageWebPCoder/SDWebImageWebPCoder.h>

@interface WebPEncoder : NSObject <RCTBridgeModule>
@end

@implementation WebPEncoder

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

// Heavy image work runs off the main/bridge thread.
- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("com.stickergenerator.webpencoder", DISPATCH_QUEUE_SERIAL);
}

#pragma mark - Helpers

// Register the WebP coder once so SDWebImage can decode/encode .webp.
static void EnsureWebPCoderRegistered(void)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [[SDImageCodersManager sharedManager] addCoder:[SDImageWebPCoder sharedCoder]];
  });
}

// Turn a JS uri (file://… or a bare path) into a filesystem path.
static NSString *PathFromUri(NSString *uri)
{
  if ([uri hasPrefix:@"file://"]) {
    NSURL *url = [NSURL URLWithString:uri];
    return url.path ?: uri;
  }
  return uri;
}

// Load an image from a uri, decoding PNG/JPEG/WebP via the registered coders.
static UIImage *LoadImage(NSString *uri)
{
  EnsureWebPCoderRegistered();
  NSString *path = PathFromUri(uri);
  NSData *data = [NSData dataWithContentsOfFile:path];
  if (data == nil) {
    NSURL *url = [NSURL URLWithString:uri];
    if (url != nil) {
      data = [NSData dataWithContentsOfURL:url];
    }
  }
  if (data == nil) {
    return nil;
  }
  return [UIImage sd_imageWithData:data];
}

// Redraw to an up-oriented, scale-1 image so pixel coordinates are unambiguous.
static UIImage *NormalizeImage(UIImage *image)
{
  if (image.imageOrientation == UIImageOrientationUp && image.scale == 1.0) {
    return image;
  }
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
  format.scale = 1.0;
  format.opaque = NO;
  CGSize size = image.size; // scale is 1.0 here, so points == pixels
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size format:format];
  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull ctx) {
    [image drawInRect:CGRectMake(0, 0, size.width, size.height)];
  }];
}

// "Contain" fit: largest centered rect of (contentW x contentH) inside a square.
// Mirrors geometry.containOnCanvas so the native output matches the JS math.
static CGRect ContainOnCanvas(CGFloat contentW, CGFloat contentH, CGFloat canvas)
{
  CGFloat scale = MIN(canvas / contentW, canvas / contentH);
  CGFloat w = round(contentW * scale);
  CGFloat h = round(contentH * scale);
  CGFloat x = round((canvas - w) / 2.0);
  CGFloat y = round((canvas - h) / 2.0);
  return CGRectMake(x, y, w, h);
}

// Render an image contained on a square transparent canvas of the given size.
static UIImage *ContainOnSquareCanvas(UIImage *image, CGFloat canvasSize)
{
  CGFloat w = CGImageGetWidth(image.CGImage);
  CGFloat h = CGImageGetHeight(image.CGImage);
  CGRect dest = ContainOnCanvas(w, h, canvasSize);

  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
  format.scale = 1.0;
  format.opaque = NO;
  UIGraphicsImageRenderer *renderer =
    [[UIGraphicsImageRenderer alloc] initWithSize:CGSizeMake(canvasSize, canvasSize) format:format];
  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull ctx) {
    [image drawInRect:dest];
  }];
}

static BOOL WriteData(NSData *data, NSString *uri, NSError **error)
{
  NSString *path = PathFromUri(uri);
  NSString *dir = [path stringByDeletingLastPathComponent];
  [[NSFileManager defaultManager] createDirectoryAtPath:dir
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:nil];
  return [data writeToFile:path options:NSDataWritingAtomic error:error];
}

#pragma mark - Exported methods

RCT_EXPORT_METHOD(cropToFile:(NSString *)inputUri
                  outputUri:(NSString *)outputUri
                  x:(double)x
                  y:(double)y
                  width:(double)width
                  height:(double)height
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @autoreleasepool {
    UIImage *image = NormalizeImage(LoadImage(inputUri));
    if (image == nil) {
      reject(@"load_failed", [NSString stringWithFormat:@"Could not load image at %@", inputUri], nil);
      return;
    }
    CGImageRef cg = image.CGImage;
    CGFloat imgW = CGImageGetWidth(cg);
    CGFloat imgH = CGImageGetHeight(cg);

    // Clamp the requested rect into the image bounds.
    CGFloat cx = MAX(0.0, MIN(x, imgW - 1));
    CGFloat cy = MAX(0.0, MIN(y, imgH - 1));
    CGFloat cw = MAX(1.0, MIN(width, imgW - cx));
    CGFloat ch = MAX(1.0, MIN(height, imgH - cy));
    CGRect rect = CGRectIntegral(CGRectMake(cx, cy, cw, ch));

    CGImageRef cropped = CGImageCreateWithImageInRect(cg, rect);
    if (cropped == NULL) {
      reject(@"crop_failed", @"CGImageCreateWithImageInRect returned null", nil);
      return;
    }
    UIImage *croppedImage = [UIImage imageWithCGImage:cropped];
    CGImageRelease(cropped);

    NSData *png = UIImagePNGRepresentation(croppedImage);
    if (png == nil) {
      reject(@"encode_failed", @"Could not PNG-encode the crop", nil);
      return;
    }
    NSError *writeError = nil;
    if (!WriteData(png, outputUri, &writeError)) {
      reject(@"write_failed", writeError.localizedDescription ?: @"Could not write crop", writeError);
      return;
    }
    resolve(outputUri);
  }
}

RCT_EXPORT_METHOD(encodeSticker:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @autoreleasepool {
    NSString *inputUri = options[@"inputUri"];
    NSString *outputUri = options[@"outputUri"];
    CGFloat canvasSize = options[@"canvasSize"] ? [options[@"canvasSize"] doubleValue] : 512.0;
    NSInteger maxBytes = options[@"maxBytes"] ? [options[@"maxBytes"] integerValue] : (100 * 1024);

    UIImage *image = NormalizeImage(LoadImage(inputUri));
    if (image == nil) {
      reject(@"load_failed", [NSString stringWithFormat:@"Could not load image at %@", inputUri], nil);
      return;
    }

    UIImage *composited = ContainOnSquareCanvas(image, canvasSize);

    EnsureWebPCoderRegistered();
    // Auto-tune quality down until the encoded WebP fits under maxBytes.
    NSData *data = nil;
    for (double quality = 0.9; ; quality -= 0.1) {
      data = [[SDImageWebPCoder sharedCoder]
              encodedDataWithImage:composited
                            format:SDImageFormatWebP
                           options:@{SDImageCoderEncodeCompressionQuality: @(quality)}];
      if (data == nil) {
        reject(@"encode_failed", @"WebP encoding returned nil", nil);
        return;
      }
      if ((NSInteger)data.length <= maxBytes || quality <= 0.3) {
        break;
      }
    }

    NSError *writeError = nil;
    if (!WriteData(data, outputUri, &writeError)) {
      reject(@"write_failed", writeError.localizedDescription ?: @"Could not write sticker", writeError);
      return;
    }
    resolve(@(data.length));
  }
}

RCT_EXPORT_METHOD(encodeTrayIcon:(NSString *)inputUri
                  outputUri:(NSString *)outputUri
                  size:(double)size
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @autoreleasepool {
    UIImage *image = NormalizeImage(LoadImage(inputUri));
    if (image == nil) {
      reject(@"load_failed", [NSString stringWithFormat:@"Could not load image at %@", inputUri], nil);
      return;
    }
    UIImage *tray = ContainOnSquareCanvas(image, size);
    NSData *png = UIImagePNGRepresentation(tray);
    if (png == nil) {
      reject(@"encode_failed", @"Could not PNG-encode the tray icon", nil);
      return;
    }
    NSError *writeError = nil;
    if (!WriteData(png, outputUri, &writeError)) {
      reject(@"write_failed", writeError.localizedDescription ?: @"Could not write tray icon", writeError);
      return;
    }
    resolve(@(png.length));
  }
}

@end
