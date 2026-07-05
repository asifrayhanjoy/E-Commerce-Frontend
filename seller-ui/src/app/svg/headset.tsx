import { SVGProps } from "react";

interface HeadsetProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const Headset = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: HeadsetProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 13v-1a8 8 0 0116 0v1"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="2.5"
        y="13"
        width="4"
        height="6"
        rx="1.5"
        stroke={fill}
        strokeWidth="1.8"
      />
      <rect
        x="17.5"
        y="13"
        width="4"
        height="6"
        rx="1.5"
        stroke={fill}
        strokeWidth="1.8"
      />
      <path
        d="M19.5 19v1a2 2 0 01-2 2h-3.5"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Headset;
