import { SVGProps } from "react";

interface MailProps extends SVGProps<SVGSVGElement> {
  fill?: string;
}

const Mail = ({
  fill = "currentColor",
  width = "20",
  height = "20",
  ...props
}: MailProps) => {
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
        x="2.5"
        y="4.5"
        width="19"
        height="15"
        rx="2"
        stroke={fill}
        strokeWidth="1.8"
      />
      <path
        d="M3.5 6l8.5 7 8.5-7"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Mail;
