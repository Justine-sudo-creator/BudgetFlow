export const Icons = {
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
      className={`w-8 h-8 ${props.className || ''}`}
    >
      <g fill="hsl(var(--primary))">
        <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z" />
        <path d="M168 100h-32V88a12 12 0 0 0-24 0v12H93a12 12 0 0 0-11.32 16l12.8 44.8a12 12 0 0 0 11.32 8h45.19a36 36 0 1 0-3.37-20.84A12 12 0 0 0 148 156a12 12 0 0 0 12 12h8a12 12 0 0 0 0-24h-4.3a12 12 0 0 0-11.42 8.24a12.18 12.18 0 0 0-3.09-1.28l-8-28h32a12 12 0 0 0 0-24Zm-13.19 80a12 12 0 1 1-12 12a12 12 0 0 1 12-12Z" />
      </g>
    </svg>
  ),
};
