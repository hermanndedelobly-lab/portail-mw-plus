package android.webkit;
public abstract class WebSettings {
  public abstract void setJavaScriptEnabled(boolean b); public abstract void setDomStorageEnabled(boolean b);
  public abstract void setLoadWithOverviewMode(boolean b); public abstract void setUseWideViewPort(boolean b);
  public abstract String getUserAgentString(); public abstract void setUserAgentString(String s);
}
