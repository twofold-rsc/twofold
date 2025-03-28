import Link from "@twofold/framework/link";
import { ComponentProps } from "react";

export function DeploymentGrid() {
  return (
    <div className="not-prose mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Link
        href="/docs/deploy/digitalocean-app-platform"
        className="group flex aspect-[16/9] h-full w-full flex-col items-center justify-center rounded-lg ring-[0.5px] shadow ring-gray-200 transition-all ring-inset hover:-translate-y-0.5 hover:shadow-md"
      >
        <DigitalOceanIcon className="size-12 grayscale-100 transition-[filter] group-hover:grayscale-0" />

        <div className="mt-2.5 text-sm">DigitalOcean App Platform</div>
      </Link>

      <Link
        href="/docs/deploy/fly-io"
        className="group flex aspect-[16/9] h-full w-full flex-col items-center justify-center rounded-lg ring-[0.5px] shadow ring-gray-200 transition-all ring-inset hover:-translate-y-0.5 hover:shadow-md"
      >
        <FlyIOIcon className="size-12 grayscale-100 transition-[filter] group-hover:grayscale-0" />

        <div className="mt-2.5 text-sm">Fly.io</div>
      </Link>
    </div>
  );
}

function DigitalOceanIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.0018 18.1446V22C18.4441 22 23.4683 15.6726 21.3581 8.81218C20.4426 5.81857 18.0868 3.43727 15.1392 2.4961C8.38438 0.352934 2.1543 5.45571 2.1543 11.9986H5.96156C5.96156 7.89368 9.96981 4.71864 14.2237 6.2835C15.798 6.86179 17.0596 8.14314 17.629 9.73068C19.1796 14.047 16.0493 18.1144 12.013 18.1219V14.2778H8.20574V18.1446H12.0018ZM8.20574 21.1042H5.29167V18.1446H8.20574V21.1042ZM2.84652 18.1446H5.29167V15.6612H2.84652V18.1446Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FlyIOIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 167 151"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit={2}
      {...props}
    >
      <path
        d="M116.78 20.613h19.23c17.104 0 30.99 13.886 30.99 30.99v67.618c0 17.104-13.886 30.99-30.99 30.99h-1.516c-8.803-1.377-12.621-4.017-15.57-6.248L94.475 123.86a3.453 3.453 0 00-4.329 0l-7.943 6.532-22.37-18.394a3.443 3.443 0 00-4.326 0l-31.078 27.339c-6.255 5.087-10.392 4.148-13.075 3.853C4.424 137.502 0 128.874 0 119.221V51.603c0-17.104 13.886-30.99 30.993-30.99H50.18l-.035.077-.647 1.886-.201.647-.871 3.862-.12.677-.382 3.869-.051 1.062-.008.372.036 1.774.088 1.039.215 1.627.275 1.465.326 1.349.423 1.46 1.098 3.092.362.927 1.912 4.04.675 1.241 2.211 3.795.846 1.369 3.086 4.544.446.602 4.015 5.225 1.297 1.609 4.585 5.36.942 1.031 3.779 4.066 1.497 1.55 2.474 2.457-.497.415-.309.279a30.309 30.309 0 00-2.384 2.49c-.359.423-.701.86-1.025 1.31-.495.687-.938 1.41-1.324 2.164-.198.391-.375.792-.531 1.202a11.098 11.098 0 00-.718 3.267l-.014.966c.035 1.362.312 2.707.819 3.972a11.06 11.06 0 002.209 3.464 11.274 11.274 0 002.329 1.896c.731.447 1.51.815 2.319 1.096 1.76.597 3.627.809 5.476.623h.01a12.347 12.347 0 004.516-1.341 11.573 11.573 0 001.724-1.117 11.057 11.057 0 003.479-4.625c.569-1.422.848-2.941.823-4.471l-.044-.799a11.305 11.305 0 00-.749-3.078c-.17-.429-.364-.848-.58-1.257-.4-.752-.856-1.473-1.362-2.158-.232-.313-.472-.62-.72-.921a29.81 29.81 0 00-2.661-2.787l-.669-.569 1.133-1.119 4.869-5.085 1.684-1.849 2.618-2.945 1.703-1.992 2.428-2.957 1.644-2.067 2.414-3.228 1.219-1.67 1.729-2.585 1.44-2.203 2.713-4.725 1.552-3.1.045-.095 1.188-2.876c.015-.037.029-.076.04-.114l1.28-3.991.134-.582.555-3.177.108-.86.033-.527.038-1.989-.01-.371-.102-1.781-.126-1.384-.63-3.988a1.521 1.521 0 00-.037-.159l-.809-2.949-.279-.82-.364-.907zm9.141 84.321c-4.007.056-7.287 3.336-7.343 7.342.059 4.006 3.337 7.284 7.343 7.341 4.005-.058 7.284-3.335 7.345-7.341-.058-4.006-3.338-7.286-7.345-7.342z"
        fill="#24175b"
        fillOpacity={0.35}
      />
      <path
        d="M72.499 147.571l-1.296 1.09a6.802 6.802 0 01-4.253 1.55H30.993a30.867 30.867 0 01-19.639-7.021c2.683.295 6.82 1.234 13.075-3.853l31.078-27.339a3.443 3.443 0 014.326 0l22.37 18.394 7.943-6.532a3.453 3.453 0 014.329 0l24.449 20.103c2.949 2.231 6.767 4.871 15.57 6.248H118.23a6.919 6.919 0 01-3.993-1.33l-.285-.22-1.207-1.003a2.377 2.377 0 00-.32-.323 21845.256 21845.256 0 00-18.689-15.497 2.035 2.035 0 00-2.606.006s.044.052-18.386 15.491c-.09.075-.172.154-.245.236zm53.422-42.637c-4.007.056-7.287 3.336-7.343 7.342.059 4.006 3.337 7.284 7.343 7.341 4.005-.058 7.284-3.335 7.345-7.341-.058-4.006-3.338-7.286-7.345-7.342zM78.453 82.687l-2.474-2.457-1.497-1.55-3.779-4.066-.942-1.031-4.585-5.36-1.297-1.609-4.015-5.225-.446-.602-3.086-4.544-.846-1.369-2.211-3.795-.675-1.241-1.912-4.04-.362-.927-1.098-3.092-.423-1.46-.326-1.349-.275-1.465-.215-1.627-.088-1.039-.036-1.774.008-.372.051-1.062.382-3.869.12-.677.871-3.862.201-.647.647-1.886.207-.488 1.03-2.262.714-1.346.994-1.64.991-1.46.706-.928.813-.98.895-.985.767-.771 1.867-1.643 1.365-1.117c.033-.028.067-.053.102-.077l1.615-1.092 1.283-.818L65.931 3.8c.037-.023.079-.041.118-.059l3.456-1.434.319-.12 3.072-.899 1.297-.291 1.754-.352L77.11.468l1.784-.222L80.11.138 82.525.01l.946-.01 1.791.037.466.026 2.596.216 3.433.484.397.083 3.393.844.996.297 1.107.383 1.348.51 1.066.452 1.566.738.987.507 1.774 1.041.661.407 2.418 1.765.694.602 1.686 1.536.083.083 1.43 1.534.492.555 1.678 2.23.342.533 1.332 2.249.401.771.751 1.678.785 1.959.279.82.809 2.949c.015.052.027.105.037.159l.63 3.988.126 1.384.102 1.781.01.371-.038 1.989-.033.527-.108.86-.555 3.177-.134.582-1.28 3.991a1.186 1.186 0 01-.04.114l-1.188 2.876-.045.095-1.552 3.1-2.713 4.725-1.44 2.203-1.729 2.585-1.219 1.67-2.414 3.228-1.644 2.067-2.428 2.957-1.703 1.992-2.618 2.945-1.684 1.849-4.869 5.085-1.133 1.119.669.569c.946.871 1.835 1.8 2.661 2.787.248.301.488.608.72.921.506.685.962 1.406 1.362 2.158.216.407.409.828.58 1.257.389.985.651 2.026.749 3.078l.044.799c.025 1.53-.255 3.05-.823 4.471a11.057 11.057 0 01-3.479 4.625c-.541.424-1.118.796-1.724 1.117a12.347 12.347 0 01-4.516 1.341h-.01a12.996 12.996 0 01-5.476-.623 11.933 11.933 0 01-2.319-1.096 11.268 11.268 0 01-2.329-1.896 11.06 11.06 0 01-2.209-3.464 11.468 11.468 0 01-.819-3.972l.014-.966c.073-1.119.315-2.221.718-3.267.157-.411.334-.812.531-1.202.386-.755.83-1.477 1.324-2.164.323-.45.667-.887 1.025-1.31a30.309 30.309 0 012.384-2.49l.309-.279.497-.415z"
        fill="#24175b"
      />
      <path
        d="M71.203 148.661l19.927-16.817a2.035 2.035 0 012.606-.006l20.216 16.823a6.906 6.906 0 004.351 1.55H66.877a6.805 6.805 0 004.326-1.55zm12.404-60.034l.195.057c.063.03.116.075.173.114l.163.144c.402.37.793.759 1.169 1.157.265.283.523.574.771.875.315.38.61.779.879 1.194.116.183.224.368.325.561.088.167.167.34.236.515.122.305.214.627.242.954l-.006.614a3.507 3.507 0 01-1.662 2.732 4.747 4.747 0 01-2.021.665l-.759.022-.641-.056a4.964 4.964 0 01-.881-.214 4.17 4.17 0 01-.834-.391l-.5-.366a3.431 3.431 0 01-1.139-1.952 5.016 5.016 0 01-.059-.387l-.018-.586c.01-.158.034-.315.069-.472.087-.341.213-.673.372-.988.205-.396.439-.776.7-1.137.433-.586.903-1.143 1.405-1.67.324-.342.655-.673 1.001-.993l.246-.221c.171-.114.173-.114.368-.171h.206zM82.348 6.956l.079-.006v68.484l-.171-.315a191.264 191.264 0 01-6.291-12.75 136.318 136.318 0 01-4.269-10.688 84.358 84.358 0 01-2.574-8.802c-.541-2.365-.956-4.765-1.126-7.19a35.028 35.028 0 01-.059-3.108c.016-.903.053-1.804.109-2.705.09-1.418.234-2.832.442-4.235.165-1.104.368-2.205.62-3.293.2-.865.431-1.723.696-2.567.382-1.22.84-2.412 1.373-3.576.195-.419.405-.836.624-1.245 1.322-2.449 3.116-4.704 5.466-6.214a11.422 11.422 0 015.081-1.79zm8.88.173l4.607 1.314a28.193 28.193 0 016.076 3.096 24.387 24.387 0 016.533 6.517 24.618 24.618 0 012.531 4.878 28.586 28.586 0 011.761 7.898c.061.708.096 1.418.11 2.127.016.659.012 1.321-.041 1.98a22.306 22.306 0 01-.828 4.352 34.281 34.281 0 01-1.194 3.426 49.43 49.43 0 01-1.895 4.094c-1.536 2.966-3.304 5.803-5.195 8.547a133.118 133.118 0 01-7.491 9.776 185.466 185.466 0 01-8.987 9.96c2.114-3.963 4.087-8 5.915-12.102a149.96 149.96 0 002.876-6.93 108.799 108.799 0 002.679-7.792 76.327 76.327 0 001.54-5.976c.368-1.727.657-3.472.836-5.228.15-1.464.205-2.937.169-4.406a62.154 62.154 0 00-.1-2.695c-.216-3.612-.765-7.212-1.818-10.676a31.255 31.255 0 00-1.453-3.849c-1.348-2.937-3.23-5.683-5.776-7.686l-.855-.625z"
        fill="#fff"
      />
    </svg>
  );
}
