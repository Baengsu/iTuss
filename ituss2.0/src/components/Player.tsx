"use client";

type PlayerProps = {
  url: string;
};

export default function Player({ url }: PlayerProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        src={url}
        autoPlay
        controls
        playsInline
        className="w-full h-full object-contain bg-black"
      />
    </div>
  );
}
