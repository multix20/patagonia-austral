<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Despacha los avisos programados cuya hora de publicación ya llegó (Web Push).
Schedule::command('avisos:despachar')->everyMinute();
