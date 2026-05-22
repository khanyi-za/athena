import { z } from 'zod'

// Employee module schemas — mirrors docs/Api-frontend-contracts/store-module-api.md
// §"Employee Object" and §"Employee Management".
//
// The user shape varies by endpoint:
//   - In GET /stores/me employees array: { id, email, firstName, lastName }
//   - In GET /stores/:storeId/employees: { id, firstName, lastName, avatarUrl }
//
// This file models the latter (the dedicated employee endpoint). The /stores/me
// variant is already defined in lib/schemas/store.ts as employeeInStoreMeSchema.

// ----------------------------------------------------------------------------
// User shape attached to employee rows on the dedicated endpoint
// ----------------------------------------------------------------------------

const employeeUserSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    avatarUrl: z.string().nullable(),
  })
  .nullable() // null until the invite is accepted

// ----------------------------------------------------------------------------
// Employee object (full)
// ----------------------------------------------------------------------------

export const employeeSchema = z.object({
  id: z.string(),
  email: z.string(),
  employeeNumber: z.string().nullable(),
  isActive: z.boolean(),
  acceptedAt: z.string().nullable(), // null = invite pending
  createdAt: z.string(),
  user: employeeUserSchema,
})

// GET /stores/:storeId/employees response
export const employeesListResponseSchema = z.object({
  data: z.array(employeeSchema),
})

// ----------------------------------------------------------------------------
// POST /stores/:storeId/employees — invite body
// ----------------------------------------------------------------------------

export const inviteEmployeeBodySchema = z.object({
  email: z.string().email(),
})

// Success response is a slim version of Employee (no user, no employeeNumber yet)
export const inviteEmployeeResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  isActive: z.boolean(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
})

// ----------------------------------------------------------------------------
// Deactivate / reactivate responses — slim employee record
// ----------------------------------------------------------------------------

export const employeeStateChangeResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  employeeNumber: z.string().nullable(),
  isActive: z.boolean(),
  acceptedAt: z.string().nullable(),
})

// Resend + delete return { message: string } — we don't strictly need to parse,
// but keep a schema for typed consistency.
export const employeeMessageResponseSchema = z.object({
  message: z.string(),
})

// ----------------------------------------------------------------------------
// Type exports
// ----------------------------------------------------------------------------

export type Employee = z.infer<typeof employeeSchema>
export type EmployeesListResponse = z.infer<typeof employeesListResponseSchema>
export type InviteEmployeeBody = z.infer<typeof inviteEmployeeBodySchema>
export type InviteEmployeeResponse = z.infer<typeof inviteEmployeeResponseSchema>
export type EmployeeStateChangeResponse = z.infer<
  typeof employeeStateChangeResponseSchema
>

// ----------------------------------------------------------------------------
// Visual state helper — drives the 3 row variants per
// store-frontend-flows §4.2
// ----------------------------------------------------------------------------

export type EmployeeVisualState = 'pending' | 'active' | 'deactivated'

export function employeeVisualState(employee: Employee): EmployeeVisualState {
  if (employee.acceptedAt === null && employee.isActive) return 'pending'
  if (employee.isActive) return 'active'
  return 'deactivated'
}
