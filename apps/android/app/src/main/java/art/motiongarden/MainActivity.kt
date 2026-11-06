package art.motiongarden

import android.os.Bundle
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme(colorScheme = darkColorScheme()) { Garden() } }
    }
}
data class Artwork(val id: String, val title: String, val parameters: List<Parameter>)
data class Parameter(val key: String, val label: String, val min: Float, val max: Float, val initial: Float)
@Composable fun Garden() {
    val context = LocalContext.current
    val artworks = remember {
        val catalog = JSONObject(context.assets.open("bundle/catalog/v1/index.json").bufferedReader().readText()).getJSONArray("items")
        (0 until catalog.length()).map { index ->
            val path = catalog.getJSONObject(index).getString("manifest")
            require(path.matches(Regex("artworks/[a-z0-9-]+/v1/manifest.json")))
            val json = JSONObject(context.assets.open("bundle/$path").bufferedReader().readText())
            require(json.getInt("schemaVersion") == 1)
            val params = json.getJSONArray("parameters")
            Artwork(json.getString("id"), json.getString("title"), (0 until params.length()).map { i ->
                val p = params.getJSONObject(i)
                Parameter(p.getString("key"), p.getString("label"), p.getDouble("min").toFloat(), p.getDouble("max").toFloat(), p.getDouble("default").toFloat())
            })
        }
    }
    var selected by remember { mutableStateOf<Artwork?>(null) }
    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.safeDrawingPadding().padding(20.dp)) {
            Text("MotionGarden", style = MaterialTheme.typography.headlineLarge)
            Text("A place for living art.", Modifier.padding(vertical = 12.dp))
            if (selected == null) artworks.forEach { art -> Button(onClick = { selected = art }) { Text(art.title) } }
            selected?.let { art ->
                TextButton(onClick = { selected = null }) { Text("Back to garden") }
                key(art.id) { ArtworkPlayer(art) }
            }
        }
    }
}
@Composable fun ColumnScope.ArtworkPlayer(art: Artwork) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current
    val origin = "https://appassets.androidplatform.net"
    val loader = remember { WebViewAssetLoader.Builder().addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(context)).build() }
    val web = remember {
        WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.domStorageEnabled = false
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                    if (request.url.scheme == "https" && request.url.host == "appassets.androidplatform.net") {
                        val mapped = request.url.buildUpon().path("/bundle" + request.url.path).build()
                        return loader.shouldInterceptRequest(mapped) ?: WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", emptyMap(), null)
                    }
                    return WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", emptyMap(), null)
                }
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = true
            }
            loadUrl("$origin/renderer/v1/index.html?id=${art.id}")
        }
    }
    fun send(message: JSONObject) { web.evaluateJavascript("window.MotionGarden?.dispatch($message)", null) }
    var paused by remember { mutableStateOf(false) }
    val values = remember { mutableStateMapOf<String, Float>().apply { art.parameters.forEach { put(it.key, it.initial) } } }
    AndroidView(factory = { web }, modifier = Modifier.fillMaxWidth().weight(1f))
    Text(art.title, style = MaterialTheme.typography.titleLarge)
    Button(onClick = { paused = !paused; send(JSONObject().put("type", if (paused) "PAUSE" else "RESUME")) }) { Text(if (paused) "Play" else "Pause") }
    art.parameters.filter { it.key != "seed" }.forEach { p ->
        Text(p.label)
        Slider(value = values[p.key] ?: p.initial, valueRange = p.min..p.max, onValueChange = {
            values[p.key] = it
            send(JSONObject().put("type", "SET_PARAMETERS").put("values", JSONObject(values.toMap())))
        })
    }
    DisposableEffect(web, lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP) { send(JSONObject().put("type", "PAUSE")); web.onPause() }
            if (event == Lifecycle.Event.ON_START) { web.onResume(); if (!paused) send(JSONObject().put("type", "RESUME")) }
        }
        lifecycle.lifecycle.addObserver(observer)
        onDispose { lifecycle.lifecycle.removeObserver(observer); send(JSONObject().put("type", "DISPOSE")); web.stopLoading(); web.destroy() }
    }
}
