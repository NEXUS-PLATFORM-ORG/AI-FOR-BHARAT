import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F172A] text-white px-3 py-2 text-[11px] shadow-lg">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function RiskDistributionChart({ chartData }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        barCategoryGap="30%"
        barGap={4}
        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke="#F1F5F9" />
        <XAxis
          dataKey="dept"
          tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 12 }}
        />
        <Bar dataKey="actual" name="Actual Risks" fill="#0F172A" radius={[2, 2, 0, 0]} />
        <Bar dataKey="threshold" name="Threshold Capacity" fill="#E2E8F0" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
