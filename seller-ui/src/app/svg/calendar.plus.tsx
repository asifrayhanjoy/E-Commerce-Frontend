import { SVGProps } from "react";

interface CalendarPlusProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const CalendarPlus = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: CalendarPlusProps) => {
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
        y="4.5"
        width="18"
        height="16"
        rx="2"
        stroke={fill}
        strokeWidth="1.8"
      />
      <path
        d="M3 9.5H21"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 2.5V6.5M16 2.5V6.5"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 12.5V18.5M9 15.5H15"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default CalendarPlus;
