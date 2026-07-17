import { SVGProps } from "react";

interface SquarePlusProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const SquarePlus = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: SquarePlusProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        stroke={fill}
        strokeWidth="1.8"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SquarePlus;
