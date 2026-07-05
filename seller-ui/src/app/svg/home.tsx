const Home = ({ fill = "currentColor", width = "20", height = "20", ...props }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" fill={fill} />
      <rect x="14" y="3" width="7" height="5" rx="1.5" fill={fill} />
      <rect x="14" y="12" width="7" height="9" rx="1.5" fill={fill} />
      <rect x="3" y="16" width="7" height="5" rx="1.5" fill={fill} />
    </svg>
  );
};

export default Home;
