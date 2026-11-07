package ci.mwplus.portail;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Application MW+ : affiche le portail https://mw-pluss.netlify.app en plein écran.
 * Le contenu vient du site : tout ce qui est publié dans l'administration apparaît
 * dans l'application sans mise à jour. Les liens externes (téléphone, WhatsApp,
 * e-mail, sources, administration) s'ouvrent dans l'application adaptée.
 */
public class MainActivity extends Activity {
    static final String SITE = "https://mw-pluss.netlify.app/";
    static final String HOTE = "mw-pluss.netlify.app";

    static final String HORS_LIGNE =
        "<!doctype html><html lang='fr'><head><meta charset='utf-8'>"
        + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        + "<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;"
        + "background:#0d2416;color:#f1ecdf;font-family:sans-serif;text-align:center;padding:24px;box-sizing:border-box}"
        + "h1{color:#f6c945;font-size:1.5rem}a{display:inline-block;margin-top:16px;padding:12px 24px;border-radius:999px;"
        + "background:#17803a;color:#fff;text-decoration:none;font-weight:bold}</style></head><body><div>"
        + "<h1>Pas de connexion</h1><p>MW+ a besoin d'internet pour afficher la culture wê.<br>"
        + "Vérifiez votre connexion, puis réessayez.</p><a href='" + SITE + "'>Réessayer</a></div></body></html>";

    WebView web;

    @Override
    protected void onCreate(Bundle etat) {
        super.onCreate(etat);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setUserAgentString(s.getUserAgentString() + " MWPlusApp/1.0");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                return ouvrirAilleurs(url);
            }

            @Override
            public void onReceivedError(WebView v, int code, String description, String url) {
                v.loadData(HORS_LIGNE, "text/html; charset=utf-8", null);
            }
        });
        web.loadUrl(SITE);
    }

    /** Vrai si le lien doit s'ouvrir hors de l'application. */
    boolean ouvrirAilleurs(String url) {
        Uri u = Uri.parse(url);
        String schema = u.getScheme();
        String chemin = u.getPath() == null ? "" : u.getPath();
        boolean web = "https".equals(schema) || "http".equals(schema);
        if (web && HOTE.equals(u.getHost()) && !chemin.startsWith("/admin")) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (Exception e) {
            // aucune application ne sait ouvrir ce lien : on l'ignore
        }
        return true;
    }

    @Override
    public boolean onKeyDown(int touche, KeyEvent e) {
        if (touche == KeyEvent.KEYCODE_BACK && web != null && web.canGoBack()) {
            web.goBack();
            return true;
        }
        return super.onKeyDown(touche, e);
    }
}
