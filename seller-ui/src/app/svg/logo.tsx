const Logo = () => {
  return (
    <div className="border border-slate-800 bg-black h-[45px] flex items-center justify-center w-[45px] rounded-lg">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="3" cy="3" r="1.6" fill="#ffffff"></circle>
        <circle cx="10" cy="3" r="1.6" fill="#ffffff"></circle>
        <circle cx="17" cy="3" r="1.6" fill="#ffffff"></circle>
        <circle cx="3" cy="10" r="1.6" fill="#ffffff"></circle>
        <circle cx="10" cy="10" r="1.6" fill="#ffffff"></circle>
        <circle cx="17" cy="10" r="1.6" fill="#ffffff"></circle>
        <circle cx="3" cy="17" r="1.6" fill="#ffffff"></circle>
        <circle cx="10" cy="17" r="1.6" fill="#ffffff"></circle>
        <circle cx="17" cy="17" r="1.6" fill="#ffffff"></circle>
      </svg>
    </div>
  );
};
export default Logo;