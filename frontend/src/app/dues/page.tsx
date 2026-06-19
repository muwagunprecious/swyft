import { formatNaira } from "@/lib/swyft-data";

const dues = [
  ["Computer Science Departmental Dues", "OOU", 7500],
  ["Faculty of Engineering Levy", "UNILAG", 12000],
  ["Mass Communication Association Dues", "UI", 5000],
];

export default function DuesPage() {
  return (
    <div className="bg-gray-50 py-10">
      <div className="wrap grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
        <section>
          <p className="eyebrow mb-2">Dues Payment</p>
          <h1 className="text-4xl font-black text-gray-950 md:text-5xl">Pay faculty dues and department levies in seconds</h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-gray-600">
            Search dues, validate student information, pay, and receive an instant receipt.
          </p>
          <div className="mt-8 grid gap-3">
            {dues.map(([title, school, amount]) => (
              <div key={title} className="card flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-black text-gray-950">{title}</p>
                  <p className="text-sm font-semibold text-gray-500">{school}</p>
                </div>
                <span className="text-sm font-black text-[#1565FF]">{formatNaira(Number(amount))}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-black">Student validation</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "University",
              "Faculty",
              "Department",
              "Matric Number",
              "Department Initial",
              "Faculty Initial",
              "Level",
              "Email",
            ].map((field) => (
              <label key={field} className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-600">{field}</span>
                <input className="input" placeholder={field} />
              </label>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
            Validation system ready: match matric, department initials, faculty initials, and payment eligibility.
          </div>
          <button className="btn-primary mt-5 w-full">Pay Dues and Generate Receipt</button>
        </section>
      </div>
    </div>
  );
}
