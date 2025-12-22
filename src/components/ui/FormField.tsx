import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  className?: string;
}

export const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  textarea = false,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className="text-gold-light text-sm font-medium">
        {label}
        {required && <span className="text-maroon-light ml-1">*</span>}
      </Label>
      {textarea ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-gold/20 min-h-[80px]"
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type === "number" ? "text" : type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-gold/20"
        />
      )}
    </div>
  );
};
