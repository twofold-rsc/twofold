export default function ThrowInternalServerErrorPage(props: {
  error: unknown;
}) {
  throw props.error;
}
