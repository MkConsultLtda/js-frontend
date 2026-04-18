export function FormFieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive mt-1" role="alert">
      {message}
    </p>
  );
}
