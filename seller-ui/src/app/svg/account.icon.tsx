import { SVGProps } from "react";

interface AccountIconProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const AccountIcon = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: AccountIconProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="8" r="3.5" stroke={fill} strokeWidth="1.8" />
      <path
        d="M4.5 20c1.2-3.8 4.4-6 7.5-6s6.3 2.2 7.5 6"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AccountIcon;
