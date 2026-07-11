import React from "react";
import TitleBorder from "./TitleBorder";

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="relative">
      <h1
        className="relative z-10 leading-none tracking-tight"
        style={{
          fontSize: "31px",
          fontWeight: 900,
        }}
      >
        {title}
      </h1>

      <TitleBorder className="absolute top-[46%]" />
    </div>
  );
};

export default SectionTitle;
