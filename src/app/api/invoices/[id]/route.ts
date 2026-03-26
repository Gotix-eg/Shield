import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCompany } from "@/lib/with-company";

// GET /api/invoices/[id]
export const GET = withCompany(async (request: NextRequest, { companyId }) => {
  const idStr = request.nextUrl.pathname.split('/').pop() || '';
  const numericId = parseInt(idStr);
  
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invoice = isNaN(numericId)
      ? await prisma.invoice.findFirst({
          where: { invoiceNumber: idStr, companyId },
          include: { client: true, items: true, project: true },
        })
      : await prisma.invoice.findFirst({
          where: { id: numericId, companyId },
          include: { client: true, items: true, project: true },
        });
        
    if (!invoice)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("Get invoice failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});

// DELETE /api/invoices/[id]
export const DELETE = withCompany(async (request: NextRequest, { companyId, userId }) => {
  const idStr = request.nextUrl.pathname.split('/').pop() || '';
  const numericId = parseInt(idStr);

  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invoice = isNaN(numericId)
      ? await prisma.invoice.findFirst({ where: { invoiceNumber: idStr, companyId } })
      : await prisma.invoice.findFirst({ where: { id: numericId, companyId } });

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { invoiceId: invoice.id } }),
      prisma.trustTransaction.deleteMany({ where: { invoiceId: invoice.id } }),
      prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } }),
      prisma.invoice.delete({ where: { id: invoice.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete invoice failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});

// PUT /api/invoices/[id]
export const PUT = withCompany(async (request: NextRequest, { companyId, userId }) => {
  const idStr = request.nextUrl.pathname.split('/').pop() || '';
  const numericId = parseInt(idStr);

  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invoice = isNaN(numericId)
      ? await prisma.invoice.findFirst({ where: { invoiceNumber: idStr, companyId }, include: { items: true } })
      : await prisma.invoice.findFirst({ where: { id: numericId, companyId }, include: { items: true } });

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = await request.json();
    const updateData: any = {};
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.status) updateData.status = String(data.status).toUpperCase();
    if (data.discount != null) updateData.discount = data.discount;
    if (data.projectId) updateData.project = { connect: { id: Number(data.projectId) } };
    if (data.tax != null) updateData.tax = data.tax;
    if (data.bankId) updateData.bank = { connect: { id: Number(data.bankId) } };
    if (data.language) updateData.language = String(data.language).toUpperCase();
    
    if (data.currency && data.currency.toUpperCase() !== invoice.currency) {
      const newCur = data.currency.toUpperCase();
      updateData.currency = newCur;
      const { convert } = await import('@/lib/forex');
      for (const it of invoice.items) {
        const newUnit = await convert(Number(it.unitPrice), invoice.currency, newCur);
        await prisma.invoiceItem.update({
          where: { id: it.id },
          data: { unitPrice: newUnit, lineTotal: newUnit * Number(it.quantity) }
        });
      }
      // recalculate totals after conversion
      const agg = await prisma.invoiceItem.aggregate({ where: { invoiceId: invoice.id }, _sum: { lineTotal: true } });
      const subtotal = Number(agg._sum.lineTotal || 0);
      updateData.subtotal = subtotal;
      updateData.total = subtotal - Number(updateData.discount || invoice.discount || 0) + Number(updateData.tax || invoice.tax || 0);
    }

    const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: updateData });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Update invoice failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});
            prisma.trustAccount.update({ where: { id: a.id }, data: { balance: { decrement: deduction } } })
          );
          remaining -= deduction;
        }
      }
      // create payment and update invoice status inside same transaction
      const paymentRef = `TRUST-${accounts[0].id}`;
      txns.push(
        prisma.payment.create({
          data: {
            invoiceId: targetInv.id,
            amount: trustAmt,
            paidOn: new Date(),
            gateway: 'TRUST',
            txnReference: paymentRef,
          },
        }),
        prisma.invoice.update({
          where: { id: targetInv.id },
          data: { status: trustAmt >= Number(targetInv.total) ? 'PAID' : 'SENT' },
        })
      );

      await prisma.$transaction(txns);
      }

    }

    // final safety: recalc subtotal/total from DB before saving
    const invForTotals = await prisma.invoice.findUnique({ where: whereClause, include: { items: true } });
    if (invForTotals) {
      const aggTot = await prisma.invoiceItem.aggregate({ where: { invoiceId: invForTotals.id }, _sum: { lineTotal: true } });
      const sub = aggTot._sum.lineTotal ? Number(aggTot._sum.lineTotal) : 0;
      const discFin = updateData.discount != null ? Number(updateData.discount) : (invForTotals.discount ? Number(invForTotals.discount) : 0);
      const taxFin = updateData.tax != null ? Number(updateData.tax) : (invForTotals.tax ? Number(invForTotals.tax) : 0);
      updateData.subtotal = sub.toString();
      updateData.total = ((sub - discFin) * (1 + taxFin/100)).toString();
    }

    console.log('UPDATE DATA', updateData);
    invoice = await prisma.invoice.update({
      where: whereClause,
      data: updateData,
      include: { client: true, items: true },
    });
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("Update invoice failed", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
