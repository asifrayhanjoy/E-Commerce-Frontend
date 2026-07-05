import { SVGProps } from "react";

interface BellPlusProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const BellPlus = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: BellPlusProps) => {
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
        d="M18 9.5a6 6 0 00-6-6 6 6 0 00-6 6c0 5.5-2.5 6.5-2.5 6.5h17S18 15 18 9.5z"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19.5a2.5 2.5 0 005 0"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5v5M16 5h5"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BellPlus;
