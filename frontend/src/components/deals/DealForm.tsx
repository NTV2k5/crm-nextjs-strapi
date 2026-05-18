"use client";
export default function DealForm() {
  return (
    <form>
      <input name="title" placeholder="Ten deal" required />
      <input name="value" type="number" placeholder="Gia tri (VND)" />
      <select name="stage">
        {["new","qualified","proposal","negotiation"].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </form>
  );
}
