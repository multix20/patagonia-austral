<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Analítica de uso: cuántas veces se hace cada cosa en la PWA.
//
// Hace falta ANTES de la difusión al viajero (ver ESTADO_Y_PENDIENTES →
// "Publicitar la app"): sin números, el primer volante no se puede evaluar y no
// hay forma de saber qué fichas se miran ni desde qué localidad. También es la
// base de la capa comercial — a un negocio se le vende "tu ficha se vio N veces
// este mes", no una intuición.
//
// Se guarda un ROLLUP DIARIO, no un registro por evento:
//   (tipo, referencia, día) → cantidad
// Una fila por combinación y día, que se va incrementando. Motivos:
//  - Cabe en el plan gratis: 10.000 aperturas de ficha en un día son UNA fila,
//    no 10.000. La base de Neon no crece con el tráfico sino con el catálogo.
//  - No hay nada que agregar después: la consulta del CMS es un GROUP BY sobre
//    una tabla ya pequeña, sin worker ni proceso nocturno (que en Render free
//    no correrían).
//  - Es lo máximo que se puede contar sin espiar a nadie: no hay usuario, ni
//    sesión, ni dispositivo, ni IP, ni orden de los eventos. Solo el total del
//    día. No se puede reconstruir el recorrido de una persona porque el dato
//    para hacerlo nunca se guarda.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interacciones', function (Blueprint $table) {
            $table->id();
            // Qué pasó: 'ficha', 'como_llegar', 'llamar', 'reporte'… (ver
            // Interaccion::TIPOS, que es la lista blanca que valida la API).
            $table->string('tipo', 32);
            // Sobre qué. El significado depende del tipo: id de ficha, slug de
            // localidad, tipo de reporte, idioma… Nullable porque hay eventos
            // que no apuntan a nada ('app_abierta').
            $table->string('referencia', 64)->nullable();
            $table->date('dia');
            $table->unsignedInteger('cantidad')->default(0);
            $table->timestamps();

            // La clave del rollup: es lo que hace que incrementar sea idempotente
            // y que la tabla no pueda duplicar filas del mismo día.
            $table->unique(['tipo', 'referencia', 'dia']);
            // Consulta del CMS: el día más reciente primero, filtrando por tipo.
            $table->index(['dia', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interacciones');
    }
};
