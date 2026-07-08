<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Suscripciones Web Push de los dispositivos que instalaron la PWA.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->text('endpoint');           // URL única del servicio push del navegador
            $table->string('p256dh', 255);      // clave pública del cliente
            $table->string('auth', 255);        // secreto de autenticación
            $table->timestamps();
            $table->unique(['endpoint'], 'push_subscriptions_endpoint_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
