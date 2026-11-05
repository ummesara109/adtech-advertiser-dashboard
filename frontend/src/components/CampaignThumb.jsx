import { Megaphone } from 'lucide-react';

// Shows the uploaded creative when there is one, otherwise a neutral icon
export default function CampaignThumb({ media, size = 36 }) {
  const box = { width: size, height: size };
  if (media?.type === 'image') return <img src={media.url} alt="" style={box} className="shrink-0 rounded-md object-cover" />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-purple-700 text-white" style={box}>
      <Megaphone size={size * 0.5} />
    </span>
  );
}
