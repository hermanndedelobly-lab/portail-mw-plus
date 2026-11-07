package android.webkit;
public class WebViewClient {
  public boolean shouldOverrideUrlLoading(WebView v, String url) { return false; }
  public void onReceivedError(WebView v, int code, String d, String url) {}
}
