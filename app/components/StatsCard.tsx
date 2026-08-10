type StatsCardProps = {
  title: string
  value: number | string
  color?: 'orange' | 'blue' | 'gray' | 'green' | 'red'
  icon?: string
}

const colorClasses: Record<string, string> = {
  orange: 'text-brand-orange bg-brand-orange/10',
  blue: 'text-brand-blue bg-brand-blue/10',
  gray: 'text-foreground/70 bg-foreground/5',
  green: 'text-green-500 bg-green-500/10',
  red: 'text-red-500 bg-red-500/10',
}

export function StatsCard({ title, value, color = 'gray', icon }: StatsCardProps) {
  return (
    <div className={`rounded-lg p-4 border border-border-color ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </p>
    </div>
  )
}