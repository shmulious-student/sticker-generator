Pod::Spec.new do |s|
  s.name         = 'WebPEncoder'
  s.version      = '0.1.0'
  s.summary      = 'Native WebP encoder + 512x512 canvas compositor for StickerGenerator.'
  s.description  = 'Crops, contain-fits onto a square transparent canvas, and encodes WebP/PNG on-device.'
  s.homepage     = 'https://github.com/shmulious-student/sticker-generator'
  s.license      = { :type => 'MIT' }
  s.author       = { 'StickerGenerator' => 'dev@stickergenerator.app' }
  s.platform     = :ios, '15.1'
  s.source       = { :path => '.' }
  s.source_files = '*.{h,m}'
  s.requires_arc = true

  s.dependency 'React-Core'
  s.dependency 'SDWebImageWebPCoder'
end
