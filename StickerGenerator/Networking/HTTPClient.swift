import Foundation

struct HTTPResponse {
    let status: Int
    let data: Data
}

/// Thin async wrapper over URLSession shared by every provider.
struct HTTPClient {
    let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func send(_ request: URLRequest) async throws -> HTTPResponse {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.network(URLError(.badServerResponse))
            }
            return HTTPResponse(status: http.statusCode, data: data)
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.network(error)
        }
    }
}
