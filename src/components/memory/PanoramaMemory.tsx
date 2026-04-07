interface PanoramaMemoryProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function PanoramaMemory({ isDark = false, bgColor = '#ffffff' }: PanoramaMemoryProps) {
  return <div className="h-full" style={{ backgroundColor: bgColor }} />;
}
