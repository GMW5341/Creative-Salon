"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Fee {
  id: string;
  name: string;
  amount: number;
  currency: string;
  period: string;
  isActive: boolean;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  memo: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { name: string; email: string };
  fee: { name: string; period: string } | null;
}

export default function PaymentsPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Fee form
  const [feeName, setFeeName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feePeriod, setFeePeriod] = useState("MONTHLY");

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payMemo, setPayMemo] = useState("");
  const [payFeeId, setPayFeeId] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/payments`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments || []);
        setFees(data.fees || []);
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  async function handleCreateFee(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/groups/${groupId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_FEE",
        name: feeName,
        amount: parseInt(feeAmount),
        period: feePeriod,
      }),
    });

    if (res.ok) {
      const fee = await res.json();
      setFees([...fees, fee]);
      setFeeName("");
      setFeeAmount("");
      setShowFeeForm(false);
    }
    setSaving(false);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/groups/${groupId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseInt(payAmount),
        method: payMethod,
        memo: payMemo,
        feeId: payFeeId || undefined,
      }),
    });

    if (res.ok) {
      // Refresh
      const data = await fetch(`/api/groups/${groupId}/payments`).then((r) =>
        r.json()
      );
      setPayments(data.payments || []);
      setPayAmount("");
      setPayMemo("");
      setShowPaymentForm(false);
    }
    setSaving(false);
  }

  const periodLabel: Record<string, string> = {
    MONTHLY: "월간",
    PER_MEETING: "모임별",
    ONE_TIME: "일회성",
  };

  const statusLabel: Record<string, string> = {
    PENDING: "대기",
    COMPLETED: "완료",
    FAILED: "실패",
    REFUNDED: "환불",
  };

  const methodLabel: Record<string, string> = {
    CARD: "카드",
    BANK_TRANSFER: "계좌이체",
    CASH: "현금",
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const totalAmount = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">결제 관리</h1>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">총 납부 금액</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalAmount.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">결제 건수</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {payments.length}건
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">활성 회비</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {fees.length}개
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => {
            setShowFeeForm(!showFeeForm);
            setShowPaymentForm(false);
          }}
          className="border border-amber-600 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 transition"
        >
          {showFeeForm ? "취소" : "회비 설정"}
        </button>
        <button
          onClick={() => {
            setShowPaymentForm(!showPaymentForm);
            setShowFeeForm(false);
          }}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
        >
          {showPaymentForm ? "취소" : "납부 기록"}
        </button>
      </div>

      {/* Fee Form */}
      {showFeeForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            새 회비 설정
          </h2>
          <form onSubmit={handleCreateFee} className="space-y-4">
            <input
              type="text"
              value={feeName}
              onChange={(e) => setFeeName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="회비 이름 (예: 월 회비)"
              required
            />
            <input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="금액 (원)"
              required
            />
            <div className="flex gap-2">
              {Object.entries(periodLabel).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeePeriod(value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    feePeriod === value
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {saving ? "저장 중..." : "회비 설정"}
            </button>
          </form>
        </div>
      )}

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            납부 기록
          </h2>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {fees.length > 0 && (
              <select
                value={payFeeId}
                onChange={(e) => setPayFeeId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                <option value="">회비 선택 (선택사항)</option>
                {fees.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.name} - {fee.amount.toLocaleString()}원 (
                    {periodLabel[fee.period]})
                  </option>
                ))}
              </select>
            )}
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="금액 (원)"
              required
            />
            <div className="flex gap-2">
              {Object.entries(methodLabel).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPayMethod(value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    payMethod === value
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={payMemo}
              onChange={(e) => setPayMemo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="메모 (선택사항)"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {saving ? "기록 중..." : "납부 기록"}
            </button>
          </form>
        </div>
      )}

      {/* Active Fees */}
      {fees.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            설정된 회비
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <p className="font-medium text-gray-900">{fee.name}</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {fee.amount.toLocaleString()}원
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {periodLabel[fee.period]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 내역</h2>
      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          아직 결제 내역이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="px-4 py-3 text-left font-medium">이름</th>
                  <th className="px-4 py-3 text-left font-medium">금액</th>
                  <th className="px-4 py-3 text-left font-medium">방법</th>
                  <th className="px-4 py-3 text-left font-medium">상태</th>
                  <th className="px-4 py-3 text-left font-medium">날짜</th>
                  <th className="px-4 py-3 text-left font-medium">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-gray-900">
                      {payment.user.name}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {payment.amount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {payment.method
                        ? methodLabel[payment.method] || payment.method
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          payment.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : payment.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {statusLabel[payment.status] || payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {payment.memo || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
