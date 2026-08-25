// Silueta de huemul (ciervo nativo del escudo de Chile, emblema de Aysén).
// SVG propio, sin dependencias; hereda el color vía `currentColor`.
// Se usa como identidad animada del asistente (FAB y avatar del chat).
//
// Proporciones afinadas el 24-ago-2026: el dibujo se veía rechoncho. El cuerpo
// era un óvalo tan hondo como largas las patas —lomo y panza igual de curvos, sin
// entrada en el ijar— y las cuatro patas salían apiñadas del centro, que es
// justo la silueta de un animal gordo. Se subió la panza (el cuerpo pasó de 5,6
// a 3,7 unidades de hondo), se aplanó el lomo, se alargaron y afinaron las patas
// y se abrió el aplomo llevándolas a los extremos del cuerpo. Comparado a los
// tamaños de uso reales —27 px en el botón flotante y 24 px en el chat—, que es
// donde hay que juzgarlo: el detalle fino no se ve, lo que se lee es la masa.
export default function Huemul({ tam = 24, color = 'currentColor', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
      aria-hidden="true"
      {...props}
    >
      {/* astas bifurcadas */}
      <g fill="none" stroke={color} strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.1 6.6 L5.1 3.9 M5.5 5.0 L4.4 4.5" />
        <path d="M6.8 6.6 L7.7 4.1 M7.1 5.1 L8.3 4.8" />
      </g>
      {/* oreja */}
      <path d="M6.9 6.6 L8.1 5.8 L7.5 7.2 Z" />
      {/* cuello + cabeza + hocico */}
      <path d="M9.3 13 L7.3 8.7 L6.5 7 Q6.2 6.4 5.5 6.6 L3.3 8.3 Q2.8 8.7 3.5 9.2 L5.4 9.4 L6.7 10.2 L8.5 12.9 Z" />
      {/* cuerpo: lomo casi recto y panza recogida hacia el cuarto trasero */}
      <path d="M8.4 12.9 Q8.8 10.6 12 10.3 Q15.8 10 18.6 10.8 Q19.9 11.3 19.7 12.5 Q19.3 13.8 16 14 Q12.1 14.4 10 14.2 Q8.2 14 8.4 12.9 Z" />
      {/* cola */}
      <path d="M19.4 10.8 L21 9.7 L20.1 11.5 Z" />
      {/* patas: a los extremos del cuerpo, no al centro (aplomo de ciervo) */}
      <g fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round">
        <line x1="9.8" y1="13.9" x2="9.4" y2="20.8" />
        <line x1="11.3" y1="14.2" x2="11.5" y2="20.8" />
        <line x1="16.4" y1="13.8" x2="16.2" y2="20.8" />
        <line x1="18" y1="13.6" x2="18.5" y2="20.8" />
      </g>
    </svg>
  )
}
