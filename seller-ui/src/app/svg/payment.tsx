const Payment = ({ fill = "currentColor", width = "20", height = "20", ...props }) => {
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
        y="5.5"
        width="19"
        height="13"
        rx="2"
        stroke={fill}
        strokeWidth="1.8"
      />
      <path d="M2.5 9.5H21.5" stroke={fill} strokeWidth="1.8" />
      <path
        d="M5.5 14.5H9.5"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Payment;
