import SwiftUI
import WebKit

struct Artwork: Decodable, Identifiable {
    let schemaVersion: Int
    let id: String
    let title: String
    let parameters: [Parameter]
    struct Parameter: Decodable, Identifiable {
        var id: String { key }
        let key: String
        let label: String
        let min: Double
        let max: Double
        let `default`: Double
    }
}
enum Catalog {
    struct Index: Decodable { let schemaVersion: Int; let items: [Item] }
    struct Item: Decodable { let manifest: String }
    static func load() throws -> [Artwork] {
        guard let root = Bundle.main.resourceURL?.appendingPathComponent("bundle") else { throw CocoaError(.fileNoSuchFile) }
        let index = try JSONDecoder().decode(Index.self, from: Data(contentsOf: root.appendingPathComponent("catalog/v1/index.json")))
        guard index.schemaVersion == 1 else { throw CocoaError(.coderReadCorrupt) }
        return try index.items.map { item in
            guard item.manifest.range(of: "^artworks/[a-z0-9-]+/v1/manifest\\.json$", options: .regularExpression) != nil else { throw CocoaError(.fileReadInvalidFileName) }
            let artwork = try JSONDecoder().decode(Artwork.self, from: Data(contentsOf: root.appendingPathComponent(item.manifest)))
            guard artwork.schemaVersion == 1, artwork.parameters.allSatisfy({ $0.min <= $0.default && $0.default <= $0.max }) else { throw CocoaError(.coderReadCorrupt) }
            return artwork
        }
    }
}
@main struct MotionGardenApp: App {
    var body: some Scene { WindowGroup { NavigationStack { GardenView() }.preferredColorScheme(.dark) } }
}
struct GardenView: View {
    @State private var artworks: [Artwork] = []
    @State private var error: String?
    var body: some View {
        List {
            Text("A place for living art.").font(.title2)
            ForEach(artworks) { art in NavigationLink(art.title) { PlayerView(artwork: art) } }
            if let error { Text(error) }
        }.navigationTitle("MotionGarden").task { do { artworks = try Catalog.load() } catch { self.error = "The bundled collection could not be opened." } }
    }
}
struct PlayerView: View {
    let artwork: Artwork
    @State private var values: [String: Double] = [:]
    @State private var paused = false
    @Environment(\.scenePhase) private var phase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        VStack {
            ArtworkWebView(id: artwork.id, values: values, paused: paused || phase != .active)
            Button(paused ? "Play" : "Pause") { paused.toggle() }
            ForEach(artwork.parameters.filter { $0.key != "seed" }) { p in
                VStack { Text(p.label); Slider(value: Binding(get: { values[p.key] ?? p.default }, set: { values[p.key] = $0 }), in: p.min...p.max).accessibilityLabel(p.label) }
            }
        }.padding().navigationTitle(artwork.title).onAppear { values = Dictionary(uniqueKeysWithValues: artwork.parameters.map { ($0.key, $0.default) }); paused = reduceMotion }
    }
}
struct ArtworkWebView: UIViewRepresentable {
    let id: String
    let values: [String: Double]
    let paused: Bool
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "garden")
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        var url = URLComponents(string: "garden://localhost/renderer/v1/index.html")!
        url.queryItems = [URLQueryItem(name: "id", value: id)]
        if let target = url.url { view.load(URLRequest(url: target)) }
        return view
    }
    func updateUIView(_ view: WKWebView, context: Context) {
        context.coordinator.values = values; context.coordinator.paused = paused
        context.coordinator.send(view)
    }
    static func dismantleUIView(_ view: WKWebView, coordinator: Coordinator) {
        view.evaluateJavaScript("window.MotionGarden?.dispatch({type:'DISPOSE'})")
        view.stopLoading(); view.navigationDelegate = nil
    }
    final class Coordinator: NSObject, WKNavigationDelegate {
        var values: [String: Double] = [:]; var paused = false
        func send(_ view: WKWebView) {
            guard let data = try? JSONSerialization.data(withJSONObject: ["type": "SET_PARAMETERS", "values": values]), let json = String(data: data, encoding: .utf8) else { return }
            view.evaluateJavaScript("window.MotionGarden?.dispatch(\(json));window.MotionGarden?.dispatch({type:'\(paused ? "PAUSE" : "RESUME")'})")
        }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { send(webView) }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            decisionHandler(navigationAction.request.url?.scheme == "garden" && navigationAction.request.url?.host == "localhost" && navigationAction.navigationType == .other ? .allow : .cancel)
        }
    }
}
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url, url.host == "localhost", !url.path.contains(".."),
              let root = Bundle.main.resourceURL?.appendingPathComponent("bundle").standardizedFileURL else {
            urlSchemeTask.didFailWithError(URLError(.badURL)); return
        }
        let file = root.appendingPathComponent(String(url.path.dropFirst())).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"), let data = try? Data(contentsOf: file) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let types = ["html": "text/html", "js": "text/javascript", "json": "application/json", "css": "text/css", "svg": "image/svg+xml"]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": types[file.pathExtension] ?? "application/octet-stream", "Access-Control-Allow-Origin": "*"])!
        urlSchemeTask.didReceive(response); urlSchemeTask.didReceive(data); urlSchemeTask.didFinish()
    }
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}
