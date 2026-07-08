import React, { forwardRef } from "react";

interface BaseProps {
  label?: string;
  type?: "text" | "number" | "password" | "email" | "textarea";
  className?: string;
}

type InputProps = BaseProps &
  React.InputHTMLAttributes<HTMLInputElement>;

type TextareaProps = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Props = InputProps | TextareaProps;

const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  Props
>(({ label, type = "text", className, ...props }, ref) => {
  const fieldClassName = `w-full min-h-[32px] border border-white bg-white px-3 py-1 rounded-md text-sm text-black outline-none placeholder:text-gray-500 ${className ?? ""}`;

  return (
    <div className="w-full">
      {label && (
        <label className="mb-0.5 block text-sm font-semibold text-gray-300">
          {label}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={fieldClassName}
          {...(props as TextareaProps)}
        />
      ) : (
        <input
          type={type}
          ref={ref as React.Ref<HTMLInputElement>}
          className={fieldClassName}
          {...(props as InputProps)}
        />
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
