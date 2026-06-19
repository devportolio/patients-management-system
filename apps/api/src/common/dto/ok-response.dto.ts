import { ApiProperty } from '@nestjs/swagger';

/** `{ ok: true }` — returned by destructive operations like DELETE. */
export class OkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
