export default function LoadingAnimation() {
  return (
    <div className="flex justify-center items-center h-screen">
      <h1 className="text-3xl sm:text-4xl md:text-5xl">
        <div className="line-wobble" />
      </h1>
    </div>
  );
}
