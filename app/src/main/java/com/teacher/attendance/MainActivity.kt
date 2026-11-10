package com.teacher.attendance

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.print.PrintAttributes
import android.print.PrintManager
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingBytes: ByteArray? = null
    private var pendingMime: String = "application/octet-stream"
    private var pendingName: String = "attendance-export"

    companion object {
        private const val FILE_CHOOSER_REQUEST = 4101
        private const val CREATE_FILE_REQUEST = 4102
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(38, 54, 82)
        window.navigationBarColor = android.graphics.Color.rgb(38, 54, 82)

        webView = WebView(this)
        setContentView(webView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = false
        webView.settings.setSupportMultipleWindows(false)
        webView.addJavascriptInterface(AppBridge(), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return false
                return uri.scheme != "file" && uri.scheme != "https" && uri.scheme != "http" && uri.scheme != "content"
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.fileChooserCallback?.onReceiveValue(null)
                this@MainActivity.fileChooserCallback = filePathCallback
                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "application/json", "text/*"))
                }
                return try {
                    startActivityForResult(Intent.createChooser(intent, "انتخاب فایل"), FILE_CHOOSER_REQUEST)
                    true
                } catch (_: Exception) {
                    this@MainActivity.fileChooserCallback = null
                    false
                }
            }
        }
        if (savedInstanceState == null) webView.loadUrl("file:///android_asset/index.html")
        else webView.restoreState(savedInstanceState)
    }

    inner class AppBridge {
        @JavascriptInterface
        fun saveFile(base64: String, name: String, mime: String) {
            try {
                pendingBytes = Base64.decode(base64, Base64.DEFAULT)
                pendingName = name.substringAfterLast('/').ifBlank { "attendance-export" }
                pendingMime = mime.ifBlank { "application/octet-stream" }
                runOnUiThread {
                    val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = pendingMime
                        putExtra(Intent.EXTRA_TITLE, pendingName)
                    }
                    startActivityForResult(intent, CREATE_FILE_REQUEST)
                }
            } catch (_: Exception) {
                runOnUiThread { Toast.makeText(this@MainActivity, "ساخت فایل ناموفق بود", Toast.LENGTH_LONG).show() }
            }
        }

        @JavascriptInterface
        fun printPage() {
            runOnUiThread {
                try {
                    val manager = getSystemService(PRINT_SERVICE) as PrintManager
                    val adapter = webView.createPrintDocumentAdapter("گزارش حضور و غیاب")
                    manager.print("گزارش حضور و غیاب", adapter, PrintAttributes.Builder().build())
                } catch (_: Exception) {
                    Toast.makeText(this@MainActivity, "امکان چاپ در این دستگاه فراهم نیست", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    @Deprecated("Deprecated in Android API")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            FILE_CHOOSER_REQUEST -> {
                val result = if (resultCode == Activity.RESULT_OK) data?.data?.let { arrayOf(it) } else null
                fileChooserCallback?.onReceiveValue(result)
                fileChooserCallback = null
            }
            CREATE_FILE_REQUEST -> {
                if (resultCode == Activity.RESULT_OK && data?.data != null && pendingBytes != null) {
                    try {
                        contentResolver.openOutputStream(data.data!!)?.use { it.write(pendingBytes!!) }
                        Toast.makeText(this, "فایل با موفقیت ذخیره شد", Toast.LENGTH_LONG).show()
                    } catch (_: Exception) {
                        Toast.makeText(this, "ذخیره فایل ناموفق بود", Toast.LENGTH_LONG).show()
                    }
                }
                pendingBytes = null
            }
        }
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        if (::webView.isInitialized) webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        if (::webView.isInitialized) webView.destroy()
        super.onDestroy()
    }
}
