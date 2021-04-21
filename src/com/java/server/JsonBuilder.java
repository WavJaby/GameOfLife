package com.java.server;

public class JsonBuilder {
    StringBuilder builder = new StringBuilder();
    private boolean hasValue = false;

    JsonBuilder() {
        builder.append("{");
    }

    public JsonBuilder append(String key, String value) {
        if (hasValue)
            builder.append(",");
        builder.append(addQuotation(key));
        builder.append(":");
        builder.append(addQuotation(value));

        hasValue = true;
        return this;
    }

    public JsonBuilder append(String key, int value) {
        if (hasValue)
            builder.append(",");
        builder.append(addQuotation(key));
        builder.append(":");
        builder.append(value);

        hasValue = true;
        return this;
    }

    public JsonBuilder append(String key, JsonBuilder value) {
        if (hasValue)
            builder.append(",");
        builder.append(addQuotation(key));
        builder.append(":");
        builder.append(value.getResult());

        hasValue = true;

        return this;
    }

    public void appendArray(String key, String array) {
        if (hasValue)
            builder.append(",");
        builder.append(addQuotation(key));
        builder.append(":");
        builder.append(array);

        hasValue = true;
    }

    public String getResult() {
        builder.append("}");
        String result = builder.toString();
        builder.setLength(1);
        return result;
    }

    private String addQuotation(String value) {
        return "\"" + value + "\"";
    }

}
