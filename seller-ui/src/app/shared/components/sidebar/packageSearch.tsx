import { SVGProps } from "react";

interface PackageSearchProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const PackageSearch = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: PackageSearchProps) => {
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
        d="M12 3l8 4v6.5M12 3L4 7v6.5M12 3v7"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 3.5L20 7"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13.5V17c0 .4.24.76.6.92L11 21"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="17.5" r="2.8" stroke={fill} strokeWidth="1.8" />
      <path
        d="M21 21l-1.6-1.6"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default PackageSearch;
