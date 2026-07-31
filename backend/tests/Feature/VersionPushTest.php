<?php

namespace Tests\Feature;

use App\Services\WebPushSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Mockery;
use Tests\TestCase;

// Cubre el hook de despliegue de la PWA (POST /api/version/desplegada), que es
// lo que dispara el push de "versión nueva" — el único indicador que llega con
// la app cerrada. Lo que hay que proteger aquí es que ese botón NO se pueda
// apretar desde fuera ni de más: manda una notificación a todos los teléfonos.
class VersionPushTest extends TestCase
{
    use RefreshDatabase;

    private function conToken(string $token = 'secreto-de-prueba'): void
    {
        config(['webpush.deploy_token' => $token]);
    }

    /** El sender NO debe llegar a ejecutarse en los caminos rechazados. */
    private function esperarEnvios(int $veces): void
    {
        $sender = Mockery::mock(WebPushSender::class);
        $sender->shouldReceive('enviarNuevaVersion')->times($veces);
        $this->app->instance(WebPushSender::class, $sender);
    }

    /** Sender mudo: para los tests donde lo que importa es la respuesta del hook. */
    private function envioIndiferente(): void
    {
        $sender = Mockery::mock(WebPushSender::class);
        $sender->shouldReceive('enviarNuevaVersion')->zeroOrMoreTimes();
        $this->app->instance(WebPushSender::class, $sender);
    }

    public function test_sin_token_configurado_el_hook_esta_cerrado(): void
    {
        config(['webpush.deploy_token' => null]);
        $this->esperarEnvios(0);

        $this->postJson('/api/version/desplegada?token=loquesea')
            ->assertStatus(503)
            ->assertJson(['motivo' => 'hook-no-configurado']);
    }

    public function test_token_incorrecto_no_notifica(): void
    {
        $this->conToken();
        $this->esperarEnvios(0);

        $this->postJson('/api/version/desplegada?token=equivocado')->assertStatus(401);
        $this->postJson('/api/version/desplegada')->assertStatus(401);
    }

    /** Netlify avisa también de deploy previews y ramas: esos no le cambian la app a nadie. */
    public function test_solo_notifica_los_deploys_de_produccion(): void
    {
        $this->conToken();
        $this->esperarEnvios(0);

        $this->postJson('/api/version/desplegada?token=secreto-de-prueba', [
            'context' => 'deploy-preview',
            'state' => 'ready',
        ])->assertOk()->assertJson(['enviado' => false, 'motivo' => 'no-produccion']);
    }

    public function test_deploy_de_produccion_notifica(): void
    {
        $this->conToken();
        $this->esperarEnvios(1);

        $this->postJson('/api/version/desplegada?token=secreto-de-prueba', [
            'context' => 'production',
            'state' => 'ready',
            'commit_ref' => 'abc123',
        ])->assertOk()->assertJson(['enviado' => true]);
    }

    /**
     * Netlify dispara el hook más de una vez por deploy: el segundo golpe dentro
     * de la ventana no puede volver a sonarle a todos los teléfonos.
     *
     * Los dos tests de ventana miran la RESPUESTA y no cuentan llamadas al
     * sender: el envío va en un `afterResponse()`, y esos callbacks se acumulan
     * entre peticiones cuando varias corren en el mismo proceso (el caso del
     * test, no el de php-fpm, donde cada petición es un proceso que termina).
     */
    public function test_no_repite_dentro_de_la_ventana(): void
    {
        $this->conToken();
        $this->envioIndiferente();

        $this->postJson('/api/version/desplegada?token=secreto-de-prueba')
            ->assertOk()
            ->assertJson(['enviado' => true]);

        $this->postJson('/api/version/desplegada?token=secreto-de-prueba')
            ->assertOk()
            ->assertJson(['enviado' => false, 'motivo' => 'ya-avisado']);
    }

    /** Pasada la ventana, el deploy siguiente sí vuelve a avisar. */
    public function test_pasada_la_ventana_vuelve_a_notificar(): void
    {
        $this->conToken();
        $this->envioIndiferente();

        $this->postJson('/api/version/desplegada?token=secreto-de-prueba')->assertOk();
        Cache::forget('push:nueva-version'); // equivale a que caduque la ventana
        $this->postJson('/api/version/desplegada?token=secreto-de-prueba')
            ->assertOk()
            ->assertJson(['enviado' => true]);
    }

    /** El token también se acepta por cabecera (curl manual, sin exponerlo en la URL). */
    public function test_acepta_el_token_por_cabecera(): void
    {
        $this->conToken();
        $this->esperarEnvios(1);

        $this->withHeader('X-Deploy-Token', 'secreto-de-prueba')
            ->postJson('/api/version/desplegada')
            ->assertOk()
            ->assertJson(['enviado' => true]);
    }
}
