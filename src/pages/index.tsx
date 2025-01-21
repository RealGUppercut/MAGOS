import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to the MAGOS File Management System</h1>
      <Link href="/upload">Upload!</Link>
    </div>
  );
}
