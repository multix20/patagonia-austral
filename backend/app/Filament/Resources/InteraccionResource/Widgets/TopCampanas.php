<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Filament\Resources\InteraccionResource;

/**
 * Por dónde llegó la gente: el correo a los municipios, el QR del furgón, un
 * grupo de Facebook.
 *
 * Es el widget que convierte la difusión en una decisión. Sin él, el panel
 * puede decir que hubo 40 aperturas más esta semana, pero no cuál de las tres
 * cosas que se hicieron esa semana las trajo — y sin eso no se sabe qué
 * repetir, que es lo único que se le pide a medir una campaña.
 *
 * Cuenta LLEGADAS, no personas ni recorridos: la app suma el canal en la
 * apertura que trae `?c=` en la URL y después lo borra de la barra de
 * direcciones, así que una recarga no vuelve a contar y el enlace que alguien
 * reenvía no arrastra el código de otro canal. Lo que pasa DESPUÉS de esa
 * apertura —si miró fichas, si llamó a un negocio— no queda atado a este
 * número: para eso haría falta sesión o cookie, y la analítica es anónima por
 * diseño (ver la migración de `interacciones`). El efecto se lee en el embudo
 * de la página entera —aperturas → fichas vistas → contactos— en la misma
 * ventana, no ficha por ficha.
 */
class TopCampanas extends Ranking
{
    protected function tipos(): array
    {
        return ['campana'];
    }

    protected function titulo(): string
    {
        return 'Por dónde llegaron';
    }

    protected function descripcion(): string
    {
        return $this->medidoDesde('Primera apertura desde un enlace o QR con código');
    }

    protected function textoVacio(): string
    {
        return 'Todavía nadie entró por un enlace con código. Los enlaces con código son los de la campaña: rutaaustral.cl/?c=muni y compañía.';
    }

    protected function etiquetaDe(string $referencia): string
    {
        return InteraccionResource::etiqueta('campana', $referencia);
    }
}
