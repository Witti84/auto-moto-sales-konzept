<?php
/**
 * Plugin Name: Auto Moto Sales – Anfragen
 * Description: Speichert Fahrzeug- und Kontaktanfragen im WordPress-Backend und versendet Benachrichtigungen.
 * Version: 0.1.0
 * Requires PHP: 8.1
 */
if (!defined('ABSPATH')) exit;

add_action('init', function () {
    register_post_type('ams_inquiry', [
        'labels' => ['name' => 'Fahrzeuganfragen', 'singular_name' => 'Fahrzeuganfrage'],
        'public' => false, 'show_ui' => true, 'show_in_menu' => true,
        'supports' => ['title'], 'capability_type' => 'post',
    ]);
});
add_action('rest_api_init', function () {
    register_rest_route('ams/v1', '/inquiry', [
        'methods' => 'POST', 'callback' => 'ams_receive_inquiry',
        'permission_callback' => '__return_true',
    ]);
});
function ams_receive_inquiry(WP_REST_Request $request) {
    // Do not activate public submission until domain, mail transport, privacy notice and abuse protection are tested.
    if (!defined('AMS_FORMS_LIVE') || AMS_FORMS_LIVE !== true) {
        return new WP_Error('preview_only', 'Formularversand noch nicht aktiviert.', ['status' => 503]);
    }
    $origin = $request->get_header('origin');
    if (!$origin || untrailingslashit($origin) !== untrailingslashit(home_url())) {
        return new WP_Error('origin', 'Ungültige Herkunft.', ['status' => 403]);
    }
    if (!empty($_POST['website'])) return new WP_Error('spam', 'Ungültige Anfrage.', ['status' => 400]);
    $kind = sanitize_key(wp_unslash($_POST['kind'] ?? ''));
    $locale = sanitize_key(wp_unslash($_POST['locale'] ?? ''));
    if (!in_array($kind, ['contact','autoDirect','motoDirect','autoBroker','motoBroker'], true) ||
        !in_array($locale, ['de','fr','it','en'], true)) {
        return new WP_Error('type', 'Ungültige Anfrage.', ['status' => 400]);
    }
    $fields = [];
    foreach ($_POST as $key => $value) {
        if (!is_string($value)) continue;
        $key = sanitize_key($key);
        $fields[$key] = sanitize_textarea_field(wp_unslash($value));
        if (mb_strlen($fields[$key]) > 5000) return new WP_Error('size', 'Feld zu lang.', ['status' => 400]);
    }
    $required = ['fname','lname','email','phone','consent'];
    if ($kind === 'contact') $required[] = 'message';
    else $required = array_merge($required, ['brand','model','vehicleType','firstRegistration','mileage','price','power','color','street','zip','date','signature']);
    foreach ($required as $key) {
        if (empty($fields[$key])) return new WP_Error('required', 'Pflichtangaben fehlen.', ['status' => 400]);
    }
    if (!is_email($fields['email'])) return new WP_Error('email', 'Ungültige E-Mail.', ['status' => 400]);
    // Server-side rate limiting, in addition to honeypot.
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $limit_key = 'ams_rate_' . hash('sha256', $ip);
    if (get_transient($limit_key)) return new WP_Error('rate', 'Bitte später erneut versuchen.', ['status' => 429]);
    set_transient($limit_key, 1, MINUTE_IN_SECONDS);
    $post_id = wp_insert_post([
        'post_type' => 'ams_inquiry', 'post_status' => 'private',
        'post_title' => sanitize_text_field($kind . ' – ' . $fields['fname'] . ' ' . $fields['lname'] . ' – ' . current_time('mysql')),
    ], true);
    if (is_wp_error($post_id)) return new WP_Error('save', 'Speichern fehlgeschlagen.', ['status' => 500]);
    foreach ($fields as $key => $value) update_post_meta($post_id, '_ams_' . $key, $value);
    $attachments = [];
    $photos = $_FILES['photos'] ?? null;
    if ($photos && !empty($photos['name'])) {
        $names = (array) $photos['name'];
        if (count($names) > 15) return new WP_Error('photos', 'Zu viele Fotos.', ['status' => 400]);
        $total = array_sum(array_map('intval', (array) $photos['size']));
        if ($total > 12 * 1024 * 1024) return new WP_Error('photos', 'Fotos zu gross.', ['status' => 400]);
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        foreach ($names as $i => $name) {
            $file = [];
            foreach (['name','type','tmp_name','error','size'] as $part) $file[$part] = $photos[$part][$i] ?? null;
            if ($file['error'] !== UPLOAD_ERR_OK) continue;
            $type = wp_check_filetype_and_ext($file['tmp_name'], $file['name']);
            if (!in_array($type['type'] ?? '', ['image/jpeg','image/png','image/webp'], true)) continue;
            $id = media_handle_sideload($file, $post_id);
            if (!is_wp_error($id)) $attachments[] = $id;
        }
    }
    update_post_meta($post_id, '_ams_attachment_ids', $attachments);
    $lines = ["Anfragetyp: $kind", "Sprache: $locale", "Anfrage-ID: $post_id", ""];
    foreach ($fields as $key => $value) {
        if (in_array($key, ['consent','website'], true)) continue;
        $lines[] = "$key: $value";
    }
    $lines[] = ''; $lines[] = 'Fotos: ' . count($attachments) . ' (WordPress-Mediathek / Anfrage)';
    $admin_sent = wp_mail('info@auto-moto-sales.ch', 'Neue Auto Moto Sales Anfrage #' . $post_id, implode("\n", $lines));
    if (!$admin_sent) {
        update_post_meta($post_id, '_ams_mail_status', 'failed');
        return new WP_Error('mail', 'Anfrage gespeichert, E-Mail-Versand fehlgeschlagen. Bitte kontaktieren Sie uns.', ['status' => 502]);
    }
    update_post_meta($post_id, '_ams_mail_status', 'sent');
    $thanks = [
        'de' => 'Vielen Dank für Ihre Anfrage. Wir haben Ihre Angaben erhalten und melden uns bei Ihnen.',
        'fr' => 'Merci pour votre demande. Nous avons bien reçu vos informations.',
        'it' => 'Grazie per la richiesta. Abbiamo ricevuto i vostri dati.',
        'en' => 'Thank you for your enquiry. We have received your details.',
    ];
    wp_mail($fields['email'], 'Auto Moto Sales – ' . ['de'=>'Eingangsbestätigung','fr'=>'Confirmation de réception','it'=>'Conferma di ricezione','en'=>'Enquiry confirmation'][$locale], $thanks[$locale]);
    return rest_ensure_response(['ok' => true, 'id' => $post_id]);
}
