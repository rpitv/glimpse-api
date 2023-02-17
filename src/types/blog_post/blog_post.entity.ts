import { Field, ObjectType } from "@nestjs/graphql";
import { IsDate, MaxLength } from "class-validator";
import { BlogPost as PrismaBlogPost } from "@prisma/client";
import { GraphQLBigInt } from "graphql-scalars";
import { BigIntMin } from "../../custom-validators";

@ObjectType()
export class BlogPost implements PrismaBlogPost {
    /**
     * CASL "modelName" used for detecting subject type. Only necessary when the string "BlogPost" is passed to CASL's
     *   can() method, and the passed BlogPost object hasn't passed through the subject() helper function.
     * @see {@link https://casl.js.org/v6/en/advanced/typescript}
     */
    static readonly modelName = "BlogPost" as const;

    /**
     * Unique ID for this blog post. Automatically generated.
     */
    @BigIntMin(0)
    @Field(() => GraphQLBigInt, { nullable: true })
    id: bigint | null;

    /**
     * DateTime at which this blog post was posted.
     */
    @IsDate()
    @Field(() => Date, { nullable: true })
    postedAt: Date | null;

    /**
     * The title of the blog post.
     */
    @MaxLength(150)
    @Field(() => String, { nullable: true })
    title: string | null;

    /**
     * The actual body of the blog post.
     */
    @Field(() => String, { nullable: true })
    content: string | null;

    /**
     * The User ID of the author of this blog post.
     */
    @BigIntMin(0)
    @Field(() => GraphQLBigInt, { nullable: true })
    authorId: bigint | null;

    /**
     * The name to display for the author, as opposed to the actual username/person name. This allows for posting
     *  blogs as a "group".
     */
    @MaxLength(100)
    @Field(() => String, { nullable: true })
    authorDisplayName: string | null;
}
