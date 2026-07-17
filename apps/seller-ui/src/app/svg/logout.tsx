import { SVGProps } from "react";

interface LogOutProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const LogOut = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: LogOutProps) => {
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
        d="M9 21H5.5A1.5 1.5 0 014 19.5v-15A1.5 1.5 0 015.5 3H9"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 16l5-4-5-4"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12H9"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LogOut;
