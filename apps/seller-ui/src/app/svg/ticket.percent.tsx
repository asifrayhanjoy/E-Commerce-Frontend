import { SVGProps } from "react";

interface TicketPercentProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const TicketPercent = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: TicketPercentProps) => {
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
        d="M3 8.5a1.5 1.5 0 011.5-1.5h15a1.5 1.5 0 011.5 1.5v2a2 2 0 100 4v2a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5v-2a2 2 0 100-4v-2z"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9.5l5 5"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9.75" cy="9.75" r="0.75" fill={fill} />
      <circle cx="14.25" cy="14.25" r="0.75" fill={fill} />
    </svg>
  );
};

export default TicketPercent;
