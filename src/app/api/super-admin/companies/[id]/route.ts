import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function isSuperAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return false;
  try {
    const dec: any = jwt.verify(token, JWT_SECRET);
    return dec.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

// PATCH /api/super-admin/companies/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSuperAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const { status, subscriptionEnds, maxSeats } = body;

  try {
    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(subscriptionEnds !== undefined && { 
          subscriptionEnds: subscriptionEnds ? new Date(subscriptionEnds) : null 
        }),
        ...(maxSeats !== undefined && { maxSeats }),
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update company error:', error);
    return NextResponse.json({ error: 'Failed to update company', details: error.message }, { status: 500 });
  }
}

// DELETE /api/super-admin/companies/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSuperAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    // Hard delete all related data bottom-up inside a transaction to prevent foreign-key errors on hosted Postgres.
    await prisma.$transaction(async (tx) => {

      // --- Deepest relations (Dependencies of Employee, Project, Client, User) ---
      await tx.timeEntry.deleteMany({ where: { user: { companyId: id } } });
      await tx.task.deleteMany({ where: { project: { companyId: id } } });
      await tx.expense.deleteMany({ where: { user: { companyId: id } } });
      
      await tx.documentPermission.deleteMany({ where: { user: { companyId: id } } });
      await tx.document.deleteMany({ where: { uploader: { companyId: id } } });
      
      await tx.advancePayment.deleteMany({ where: { project: { companyId: id } } });
      await tx.projectAttachment.deleteMany({ where: { project: { companyId: id } } });
      await tx.projectAssignment.deleteMany({ where: { project: { companyId: id } } });
      await tx.approvalScope.deleteMany({ where: { user: { companyId: id } } });
      await tx.groupMembership.deleteMany({ where: { user: { companyId: id } } });
      await tx.reportAccess.deleteMany({ where: { user: { companyId: id } } });

      await tx.managerLawyer.deleteMany({ where: { manager: { companyId: id } } });
      await tx.managerLawyer.deleteMany({ where: { lawyer: { companyId: id } } });

      // Employee deeper items
      await tx.attendance.deleteMany({ where: { employee: { user: { companyId: id } } } });
      await tx.leaveRequest.deleteMany({ where: { employee: { user: { companyId: id } } } });
      await tx.salary.deleteMany({ where: { employee: { user: { companyId: id } } } });
      await tx.penalty.deleteMany({ where: { employee: { user: { companyId: id } } } });
      await tx.salaryDeduction.deleteMany({ where: { employee: { user: { companyId: id } } } });
      await tx.payrollItem.deleteMany({ where: { employee: { user: { companyId: id } } } });
      await tx.payslip.deleteMany({ where: { employee: { user: { companyId: id } } } });
      await tx.payrollRun.deleteMany({ where: { creator: { companyId: id } } });

      // Billing & Trust
      await tx.invoiceItem.deleteMany({ where: { invoice: { companyId: id } } });
      await tx.payment.deleteMany({ where: { invoice: { companyId: id } } });
      await tx.trustTransaction.deleteMany({ where: { project: { companyId: id } } });
      await tx.trustAccount.deleteMany({ where: { client: { companyId: id } } });
      await tx.transaction.deleteMany({ where: { creator: { companyId: id } } });

      // --- Accounting (Might reference Project, User, or Bank) ---
      await tx.bankTransaction.deleteMany({ where: { bank: { companyId: id } } });
      await tx.officeExpense.deleteMany({ where: { bank: { companyId: id } } });
      await tx.payrollBatch.deleteMany({ where: { company: { id } } });
      await tx.incomeCashLedger.deleteMany({ where: { company: { id } } });
      await tx.expenseCashLedger.deleteMany({ where: { company: { id } } });

      // --- Main Level Entities ---
      await tx.invoice.deleteMany({ where: { companyId: id } });
      await tx.project.deleteMany({ where: { companyId: id } });
      await tx.client.deleteMany({ where: { companyId: id } });

      // --- Foundation Entities ---
      await tx.bankAccount.deleteMany({ where: { companyId: id } });

      // --- Users & HR ---
      await tx.employee.deleteMany({ where: { user: { companyId: id } } });
      await tx.notification.deleteMany({ where: { user: { companyId: id } } });
      await tx.userPermission.deleteMany({ where: { user: { companyId: id } } });
      
      // Delete users themselves
      await tx.user.deleteMany({ where: { companyId: id } });

      // --- Finally delete the firm ---
      await tx.company.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Firm deleted successfully" });
  } catch (error: any) {
    console.error('Delete firm error:', error);
    return NextResponse.json(
      { error: 'Failed to delete firm.', details: error.message },
      { status: 500 }
    );
  }
}
