import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

export default function DepartmentsDetailChart({ data, lineColor }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0F172A",
            border: "none",
            borderRadius: 0,
            fontSize: 11,
            color: "#fff",
            padding: "4px 8px",
          }}
          itemStyle={{ color: "#fff" }}
          formatter={(v) => [`${v}%`, ""]}
          labelFormatter={() => ""}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
