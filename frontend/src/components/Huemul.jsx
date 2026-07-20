// Silueta de huemul (ciervo nativo del escudo de Chile, emblema de Aysén).
// SVG propio, sin dependencias; hereda el color vía `currentColor`.
// Se usa como identidad animada del asistente (FAB y avatar del chat).
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
      {/* cuerpo */}
      <path d="M8.2 12.8 Q8.6 10 12 9.7 Q16 9.4 18.8 10.8 Q20 11.4 19.7 12.8 Q19.3 15 15.5 15.1 Q11.5 15.2 9.8 14.9 Q8 14.6 8.2 12.8 Z" />
      {/* cola */}
      <path d="M19.4 10.9 L20.9 9.9 L20 11.7 Z" />
      {/* patas (par delantero y trasero) */}
      <g fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
        <line x1="10.3" y1="14.6" x2="9.9" y2="20.4" />
        <line x1="11.7" y1="14.8" x2="11.9" y2="20.4" />
        <line x1="15.8" y1="14.8" x2="15.6" y2="20.4" />
        <line x1="17.2" y1="14.6" x2="17.7" y2="20.4" />
      </g>
    </svg>
  )
}
