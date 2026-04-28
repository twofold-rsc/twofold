export default function InternalServerErrorPage(props: { error: unknown }) {
  throw props.error;
}
